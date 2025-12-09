from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
import os
import logging
from db import get_session
from models import User
from schemas import UserRegister, UserLogin, UserOut, TokenResponse

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SECRET = os.getenv("JWT_SECRET", "devsecret")
ALGORITHM = "HS256"
bearer = HTTPBearer(auto_error=False)
auth_router = APIRouter()


def create_token(user_id: int, email: str, role: str = "patient"):
    payload = {"sub": str(user_id), "email": email, "role": role, "exp": datetime.utcnow() + timedelta(hours=12)}
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)


def verify_token(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(
    token_data: dict = Depends(verify_token),
    session: AsyncSession = Depends(get_session)
) -> User:
    user_id = int(token_data.get("sub"))
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@auth_router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, session: AsyncSession = Depends(get_session)):
    """
    Register a new user account.
    
    Returns the created user object with authentication token on success.
    User is automatically logged in after registration.
    """
    try:
        # Log incoming request (without password)
        logger.info(f"Registration attempt for email: {payload.email}, name: {payload.name}, role: {payload.role}")
        
        # Validate input
        if not payload.name or not payload.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name is required"
            )
        
        if not payload.email or not payload.email.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is required"
            )
        
        if not payload.password or len(payload.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long"
            )

        # bcrypt has a 72-byte input limit; check and reject overly long passwords
        try:
            pw_bytes_len = len(payload.password.encode("utf-8"))
        except Exception:
            pw_bytes_len = None

        if pw_bytes_len is not None and pw_bytes_len > 72:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=("Password is too long. The current hashing algorithm "
                        "(bcrypt) accepts up to 72 bytes. Use a shorter password "
                        "or contact the administrator to enable a different hashing scheme."),
            )
        else:
            logger.info(f"Password byte length: {pw_bytes_len}")
        
        # Check if email already exists
        logger.info(f"Checking if email {payload.email} already exists...")
        result = await session.execute(select(User).where(User.email == payload.email.lower().strip()))
        existing = result.scalar_one_or_none()
        
        if existing:
            logger.warning(f"Registration failed: Email {payload.email} already registered")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered. Please use a different email or login."
            )
        
        # Hash password
        logger.info("Hashing password...")
        try:
            password_hash = User.hash_password(payload.password)
            logger.info("Password hashed successfully")
        except Exception as e:
            logger.error(f"Password hashing failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process password. Please try again."
            )
        
        # Create new user
        logger.info("Creating user object...")
        user = User(
            name=payload.name.strip(),
            email=payload.email.lower().strip(),
            password_hash=password_hash,
            phone=payload.phone.strip() if payload.phone else None,
            role=payload.role if payload.role in ["patient", "doctor", "admin"] else "patient"
        )
        
        logger.info(f"Adding user to session: {user.email}")
        session.add(user)
        
        # Commit to database
        logger.info("Committing user to database...")
        try:
            await session.commit()
            logger.info(f"User {user.email} successfully committed to database")
        except IntegrityError as e:
            await session.rollback()
            logger.error(f"Database integrity error: {str(e)}")
            # Check if it's a duplicate email error
            if "email" in str(e).lower() or "unique" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered. Please use a different email or login."
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Database error: {str(e)}"
            )
        except Exception as e:
            await session.rollback()
            logger.error(f"Database commit failed: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create account. Please try again later."
            )
        
        # Refresh to get the ID
        await session.refresh(user)
        logger.info(f"User registered successfully with ID: {user.id}")
        
        # If registering as a doctor, create a Doctor record
        if user.role == "doctor":
            from models import Doctor
            logger.info(f"Creating Doctor record for user: {user.email}")
            doctor = Doctor(
                name=user.name,
                specialty="General Practice",  # Default specialty
                experience="0 years",  # Default experience
                fee="500",  # Default fee
                user_id=user.id
            )
            session.add(doctor)
            await session.commit()
            logger.info(f"Doctor record created successfully for user: {user.email}")
        
        # Generate authentication token for automatic login
        token = create_token(user.id, user.email, user.role)
        logger.info(f"Authentication token generated for user: {user.email}")
        
        # Return user data with token for automatic login
        return TokenResponse(
            token=token,
            user=UserOut.model_validate(user)
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error during registration: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@auth_router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, session: AsyncSession = Depends(get_session)):
    """
    Login with email and password.
    
    Returns JWT token and user data on success.
    """
    try:
        logger.info(f"Login attempt for email: {payload.email}")
        
        # Find user by email (case-insensitive)
        result = await session.execute(select(User).where(User.email == payload.email.lower().strip()))
        user = result.scalar_one_or_none()
        
        if not user:
            logger.warning(f"Login failed: User not found for email {payload.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        if not user.verify_password(payload.password):
            logger.warning(f"Login failed: Incorrect password for email {payload.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        logger.info(f"Login successful for user: {user.email}")
        token = create_token(user.id, user.email, user.role)
        return TokenResponse(token=token, user=UserOut.model_validate(user))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again."
        )


@auth_router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


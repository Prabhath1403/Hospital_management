import { useState } from "react";
import { api } from "../lib/api";

type DoctorProfile = {
  name: string;
  specialization: string;
  experience: string;
  hospital: string;
  image: string;
  description: string;
};

type Triage = {
  summary: string;
  possibleSystems: string[];
  specialistSuggestion: string;
  recommendedTests: string[];
  doctorProfiles: DoctorProfile[];
  safetyNote: string;
  reportAnalysis?: string;
};

export default function AISymptomChecker() {
  const [symptoms, setSymptoms] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [result, setResult] = useState<Triage | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (
        !selectedFile.type.startsWith("image/") &&
        selectedFile.type !== "application/pdf"
      ) {
        alert("Please upload an image or PDF file");
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      setFile(selectedFile);

      // Create preview for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("symptoms", symptoms);
      if (file) {
        formData.append("report", file);
      }

      const { data } = await api.post("/ai/triage", formData);
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card space-y-3">
      <div className="font-semibold">AI Symptom Checker</div>
      <textarea
        className="input"
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
        placeholder="e.g., chest pain, shortness of breath, dizziness"
      />

      {/* File Upload Section */}
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
        {!file ? (
          <label className="cursor-pointer block">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-center space-y-2">
              <div className="text-2xl">📎</div>
              <div className="text-sm font-semibold text-slate-700">
                Attach Medical Report or Image
              </div>
              <div className="text-xs text-slate-500">
                Upload a medical report, X-ray, or lab test image (JPG, PNG, PDF
                - Max 5MB)
              </div>
            </div>
          </label>
        ) : (
          <div className="space-y-2">
            {filePreview && (
              <div className="flex justify-center">
                <img
                  src={filePreview}
                  alt="Preview"
                  className="max-h-40 rounded border border-slate-300"
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-700">
                <span className="font-semibold">📄 {file.name}</span>
                <div className="text-xs text-slate-500 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <button
                onClick={removeFile}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={submit}
        className="btn-primary"
        disabled={loading || (!symptoms && !file)}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>
      {result && (
        <div className="text-sm text-slate-700 space-y-2">
          <div className="text-sm">
            <div className="font-semibold">Summary of symptoms</div>
            <p className="text-slate-700">{result.summary}</p>
          </div>
          {result.reportAnalysis && (
            <div className="text-sm bg-blue-50 p-3 rounded border border-blue-200">
              <div className="font-semibold text-blue-900">
                📋 Report Analysis
              </div>
              <p className="text-blue-800 mt-1">{result.reportAnalysis}</p>
            </div>
          )}
          <div className="text-sm">
            <div className="font-semibold">Possible affected system</div>
            <p className="text-slate-700">
              {result.possibleSystems.join(", ")}
            </p>
          </div>
          <div className="text-sm">
            <div className="font-semibold">Recommended specialist</div>
            <p className="text-slate-700">{result.specialistSuggestion}</p>
          </div>
          <div>
            <div className="font-semibold">Recommended tests</div>
            <ul className="list-disc ml-5">
              {result.recommendedTests.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="text-sm">
            <div className="font-semibold">Doctor profiles</div>
            <div className="grid md:grid-cols-2 gap-3 mt-2">
              {result.doctorProfiles.map((doc) => (
                <div key={doc.name} className="card">
                  <div className="font-semibold">{doc.name}</div>
                  <div className="text-slate-600 text-sm">
                    {doc.specialization}
                  </div>
                  <div className="text-slate-500 text-xs">
                    {doc.experience} · {doc.hospital}
                  </div>
                  <div className="text-slate-600 text-sm mt-1">
                    {doc.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-500">{result.safetyNote}</div>
        </div>
      )}
    </div>
  );
}

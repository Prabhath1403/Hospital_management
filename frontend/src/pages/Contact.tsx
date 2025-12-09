export default function Contact() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <p className="text-slate-600 mb-4">Reach us for appointments, billing, or emergencies.</p>
        <div className="space-y-2 text-sm">
          <div>Address: 123 Health Ave, City</div>
          <div>Phone: +1 (555) 010-0000</div>
          <div>Email: care@carenow.health</div>
          <div>Emergency: +1 (555) 010-9111</div>
        </div>
        <div className="mt-4">
          <div className="font-semibold">Location</div>
          <div className="text-sm text-slate-600">Embed Google Maps iframe here.</div>
        </div>
      </div>
      <form className="card grid gap-3">
        <div className="font-semibold">Contact form</div>
        <input className="input" placeholder="Name" required />
        <input className="input" placeholder="Email" type="email" required />
        <input className="input" placeholder="Phone" required />
        <textarea className="input" placeholder="Message" rows={4} />
        <button className="btn-primary">Send</button>
      </form>
    </div>
  );
}


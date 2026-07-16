import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 via-primary-600 to-primary-900 text-white">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <h1 className="font-bold text-xl">🎓 UniSystem</h1>
        <Link to="/login" className="bg-white text-primary-700 px-5 py-2 rounded-lg font-medium hover:bg-gray-100">
          Login
        </Link>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
        <h2 className="text-4xl md:text-6xl font-extrabold leading-tight">
          University Management,<br /> Simplified.
        </h2>
        <p className="mt-6 text-lg text-primary-100 max-w-2xl mx-auto">
          One platform for admissions, applications, fee management and academic records —
          built for Pakistani university operations, from Data Entry to Manager sign-off.
        </p>
        <Link
          to="/login"
          className="inline-block mt-8 bg-white text-primary-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100"
        >
          Get Started →
        </Link>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Application Workflow', desc: 'Full lifecycle tracking with audit trail from creation to final decision.' },
          { title: 'Dynamic Fee Management', desc: 'Semester-wise fees, custom columns, and Excel import — no code changes needed.' },
          { title: 'Role-Based Dashboards', desc: 'Manager, Accounts, Student Affair, Data Entry, Record Room — each with their own view.' },
        ].map((f) => (
          <div key={f.title} className="bg-white/10 rounded-xl p-6 backdrop-blur">
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-primary-100 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

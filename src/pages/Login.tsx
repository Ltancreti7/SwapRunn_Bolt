import { Link } from "react-router-dom";
import { Users, Car } from "lucide-react";
import { Button } from "@/components/ui/button";

const Login = () => {
  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-4xl space-y-12">
        <header className="text-center space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#E11900]">
            Choose Your Portal
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold">
            Sign in to SwapRunn
          </h1>
          <p className="text-neutral-400 max-w-2xl mx-auto text-base sm:text-lg">
            Select the option that matches your role so we can take you to the right experience.
          </p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2">
          <article className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#E11900]/10 text-[#E11900] flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Sales & Staff</h2>
                <p className="text-sm text-neutral-400">
                  Dealers, sales managers, coordinators, and admin roles
                </p>
              </div>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed mb-8 flex-1">
              Access the dealership dashboard to create jobs, manage drivers, and track deliveries in real time.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-[#E11900] hover:bg-[#B51400] text-white font-semibold"
            >
              <Link to="/dealer/auth">Continue to Sales & Staff</Link>
            </Button>
          </article>

          <article className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#E11900]/10 text-[#E11900] flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Drivers</h2>
                <p className="text-sm text-neutral-400">
                  Professional drivers delivering for dealerships
                </p>
              </div>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed mb-8 flex-1">
              Sign in to accept jobs, update delivery statuses, and get navigation with live updates.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700"
            >
              <Link to="/driver/auth">Continue to Driver Portal</Link>
            </Button>
          </article>
        </section>

        <footer className="text-center text-neutral-500 text-sm">
          Need to create a dealership account? {" "}
          <Link to="/dealers/registration" className="text-[#E11900] hover:underline">
            Register here
          </Link>
          .
        </footer>
      </div>
    </main>
  );
};

export default Login;

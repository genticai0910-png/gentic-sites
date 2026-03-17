import Hero from "@/components/Hero";
import LogoBar from "@/components/LogoBar";
import ProblemSolution from "@/components/ProblemSolution";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import Capabilities from "@/components/Capabilities";
import FinalCTA from "@/components/FinalCTA";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <LogoBar />
      <ProblemSolution />
      <Services />
      <HowItWorks />
      <Capabilities />
      <FinalCTA />
      <ContactForm />
      <Footer />
    </main>
  );
}

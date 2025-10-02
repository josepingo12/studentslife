import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary flex items-center justify-center p-4">
      <div className="text-center space-y-8 ios-card p-8 max-w-2xl">
        <div>
          <h1 className="text-5xl font-bold text-primary mb-4">Students Life</h1>
          <p className="text-xl text-muted-foreground">
            La piattaforma che connette studenti e partner locali
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register-client">
            <Button className="ios-button h-12 px-8 w-full sm:w-auto">
              Registrati come Cliente
            </Button>
          </Link>
          <Link to="/register-partner">
            <Button variant="outline" className="h-12 px-8 w-full sm:w-auto rounded-xl border-2">
              Registrati come Partner
            </Button>
          </Link>
        </div>

        <div className="pt-4">
          <Link to="/login" className="text-muted-foreground hover:text-foreground">
            Hai già un account? <span className="text-primary font-semibold">Accedi</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;

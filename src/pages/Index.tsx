import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.png";

const Index = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary flex items-center justify-center p-4">
      <div className="text-center space-y-8 ios-card p-8 max-w-2xl">
        <div>
          <img src={logo} alt="Students Life" className="w-48 h-48 mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">
            {t("auth.welcomeTitle")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register-client">
            <Button className="ios-button h-12 px-8 w-full sm:w-auto">
              {t("auth.registerAsClient")}
            </Button>
          </Link>
          <Link to="/register-partner">
            <Button variant="outline" className="h-12 px-8 w-full sm:w-auto rounded-xl border-2">
              {t("auth.registerAsPartner")}
            </Button>
          </Link>
        </div>

        <div className="pt-4">
          <Link to="/login" className="text-muted-foreground hover:text-foreground">
            {t("auth.hasAccount")} <span className="text-primary font-semibold">{t("auth.login")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;

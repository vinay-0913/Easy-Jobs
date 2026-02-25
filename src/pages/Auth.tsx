import { useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { SignIn, SignUp, useAuth } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BriefcaseDoodle } from "@/components/doodles";
import { ArrowLeft } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isSignedIn, isLoaded } = useAuth();

  const isSignUp = searchParams.get("mode") === "signup";

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/dashboard");
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="container flex h-16 items-center">
        <Link
          to="/"
          className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to home</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4">
              <BriefcaseDoodle className="h-12 w-12 text-primary" />
            </div>
          </CardHeader>

          <CardContent className="flex justify-center">
            {isSignUp ? (
              <SignUp
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-lg border border-border",
                    headerTitle: "text-foreground",
                    headerSubtitle: "text-muted-foreground",
                    socialButtonsBlockButton:
                      "border-border hover:bg-muted/50",
                    formFieldInput:
                      "border-border focus:ring-primary",
                    formButtonPrimary:
                      "bg-primary hover:bg-primary/90",
                    footerActionLink: "text-primary hover:text-primary/80",
                  },
                }}
                signInUrl="/auth"
                forceRedirectUrl="/dashboard"
              />
            ) : (
              <SignIn
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-lg border border-border",
                    headerTitle: "text-foreground",
                    headerSubtitle: "text-muted-foreground",
                    socialButtonsBlockButton:
                      "border-border hover:bg-muted/50",
                    formFieldInput:
                      "border-border focus:ring-primary",
                    formButtonPrimary:
                      "bg-primary hover:bg-primary/90",
                    footerActionLink: "text-primary hover:text-primary/80",
                  },
                }}
                signUpUrl="/auth?mode=signup"
                forceRedirectUrl="/dashboard"
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Auth;

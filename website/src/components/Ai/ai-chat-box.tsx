import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useGoogleToken } from "@/context/GoogleTokenContext";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import GoogleInit from "../GoogleInit";

const AiChatBox = () => {
  const { googleToken } = useGoogleToken();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAutomate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setInput("");
    }, 1000);
  };

  return (
    <section className="px-6 relative">
      <div
        className={` border rounded-2xl min-h-[52vh] p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-sm flex flex-col justify-between transition-all "
        `}
      >
        {!googleToken && (
          <Card className="absolute bg-gradient-to-br from-red-50 via-white to-red-100  top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20  flex items-center justify-center ">
            <CardContent className="text-center w-full">
              <div className="font-semibold text-lg mb-2">
                Google Sheets Access Required
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                You need to allow access to Google Sheets to use this feature.
                <br /> details, please review our{" "}
                <Link href={""} className="text-blue-400">
                  Privacy Policy.
                </Link>
              </div>
              <GoogleInit />
            </CardContent>
          </Card>
        )}
        {/* Main content area */}
        <div></div>
        {/* Input and button at the bottom */}
        <div className="mt-4 w-full">
          <div className="flex justify-end mt-2">
            <Button
              variant="default"
              onClick={handleAutomate}
              disabled={!input.trim() || loading || !googleToken}
            >
              <Sparkles fill="white" className="mr-2 h-4 w-4" /> Automate
            </Button>
          </div>
          <Textarea
            placeholder="Enter your instructions here..."
            minLength={1}
            rows={3}
            className="min-h-[80px] rounded-lg w-full mt-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || !googleToken}
          />
        </div>
      </div>
    </section>
  );
};

export default AiChatBox;

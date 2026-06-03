import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { TerminalIntro } from "./components/TerminalIntro";
// Side-effect import: starts the global AIS preload stream while the terminal
// intro is still playing so ships are already cached when the user enters.
import "@/lib/aisStore";

const queryClient = new QueryClient();

const App = () => {
  const [introDone, setIntroDone] = useState(false);
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {!introDone && <TerminalIntro onComplete={() => setIntroDone(true)} />}
      {introDone && (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      )}
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;

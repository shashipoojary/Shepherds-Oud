"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ProviderDetailActions({ providerName }: { providerName: string }) {
  const [message, setMessage] = useState("");

  return (
    <>
      {message ? <div className="mt-4 rounded-[10px] bg-sage-100 px-4 py-3 text-sm text-sage-700">{message}</div> : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={() => setMessage(`Visit requested at ${providerName}.`)}>
          Request a visit
        </Button>
        <Button variant="outline" onClick={() => setMessage(`Callback requested from ${providerName}.`)}>
          Request a callback
        </Button>
        <Button variant="ghost" onClick={() => setMessage(`${providerName} saved to favourites.`)}>
          Save to favourites
        </Button>
      </div>
    </>
  );
}

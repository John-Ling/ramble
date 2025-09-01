"use client";
import { Button } from "../ui/button";
import { signIn } from "next-auth/react";
import { ChromeIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";

export default function LoginForm() {
  const on_login = async () => {
    await signIn("google");
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <Input placeholder="username"/>
        <Input placeholder="password"/>
        
        <div className="flex flex-col items-center justify-center gap-2">
          <Button variant="secondary" className="text-foreground w-40" size="sm" onClick={on_login}>Login</Button>
          <Separator className="my-2"/>
          <Button variant="secondary" className="text-foreground" size="sm" onClick={on_login}><ChromeIcon /> Sign in With Google</Button>
        </div>
      </div>
    </>
  )
}
"use client";
import { Button } from "../ui/button";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const on_login = async () => {
    await signIn("google");
  }

  return (
    <>
      <div className="flex justify-evenly">
        <Button variant="secondary" className="" onClick={on_login}>Sign in With Google</Button>
      </div>
    </>
  )
}
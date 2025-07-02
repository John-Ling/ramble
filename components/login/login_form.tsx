"use client";
import { Button } from "../ui/button";

export default function LoginForm() {
  return (
    <>
      <div className="flex justify-evenly">
        <Button variant="secondary">Login</Button>
        <Button variant="secondary">Logout</Button>
      </div>
    </>
  )
}
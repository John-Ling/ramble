import LoginForm from "./login_form"

export default function LoginPage() {
  return (
    <>
      <div className="min-h-screen w-full flex items-center justify-center flex-col">
        <div>
          <h1 className="font-bold text-4xl">Ramble</h1>
          <h2 className="text-3xl">What's on your mind?</h2>
          <LoginForm />
        </div>
      </div>
    </>
  )
}
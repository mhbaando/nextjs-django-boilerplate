const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-5">
      <div className="relative flex flex-col items-center justify-center p-8 lg:col-span-3">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(hsl(var(--border)) 0.5px, transparent 0.5px)",
            backgroundSize: "1rem 1rem",
            opacity: 0.3,
          }}
        />
        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-primary"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <span className="text-2xl font-bold text-primary">YourApp</span>
            </div>
          </div>

          {children}
        </div>
      </div>
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground lg:col-span-2 lg:flex">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(hsla(0,0%,100%,.03) 1px, transparent 1px), linear-gradient(90deg, hsla(0,0%,100%,.03) 1px, transparent 1px)",
            backgroundSize: "3rem 3rem",
          }}
        />
        <div
          className="absolute -right-1/4 -top-1/4 h-full w-full rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, hsla(0,0%,100%,.07) 0, transparent 40%)",
          }}
        />
        <div
          className="absolute -left-1/3 -bottom-1/2 h-full w-full"
          style={{
            background:
              "radial-gradient(circle at center, hsla(0,0%,100%,.05) 0, transparent 50%)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, hsla(0,0%,100%,.05) 0, transparent 60%)",
          }}
        />
        <div className="relative z-10 flex items-center gap-2 text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span>Your Logo</span>
        </div>
        <div className="relative z-10 mt-auto w-full  flex items-center justify-center flex-col">
          <h1 className="text-4xl font-bold leading-tight max-w-md text-center">
            Accelerate your development process
          </h1>
          <p className="mt-4 text-sm text-primary-foreground/80">
            Build modern solutions with cutting-edge technology.
          </p>

          <p className="text-xs mt-10">
            {" "}
            {new Date().getFullYear()} Copyright 2025 All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

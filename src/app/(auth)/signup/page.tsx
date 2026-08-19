'use client';

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SignupFormSchema } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import Image from "next/image";
import SyncSpaceLogo from "../../../../public/syncspacelogo.svg";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/global/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MailCheck } from "lucide-react";
import { actionSignupUser } from "@/lib/server-action/auth-actions";

const SignupForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitError, setSubmitError] = useState("");
  const [confirmation, setConfirmation] = useState(false);

  const codeExchangeError = useMemo(() => {
    if (!searchParams) return "";
    return searchParams.get("error_description");
  }, [searchParams]);

  const confirmationAndErrorStyles = useMemo(
    () =>
      clsx("bg-black border-[2px] border-primary-blue-100", {
        "bg-red-500/10": codeExchangeError,
        "border-red-500/60": codeExchangeError,
        "text-red-700": codeExchangeError,
      }),
    [codeExchangeError]
  );

  const form = useForm<z.infer<typeof SignupFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(SignupFormSchema),
    defaultValues: { email: "", fullName: "", password: "", confirmPassword: "" },
  });

  const isLoading = form.formState.isSubmitting;

  const handleNativeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match");
      return;
    }

    if (!email || !password || !fullName) {
      setSubmitError("Please fill out all fields.");
      return;
    }

    const plainPayload = { email, password, fullName };

    const response = await actionSignupUser(plainPayload);
    const { error, data } = response || {};
    
    if (error) {
      setSubmitError(error.message);
      setConfirmation(false);
      return;
    }
    
    if (data?.session) {
      router.push("/dashboard");
    } else {
      setConfirmation(true);
    }
  };

  return (
    <Form {...form}>
      <form
        onChange={() => {
          if (submitError) setSubmitError("");
        }}
        onSubmit={handleNativeSubmit}
        className="w-full sm:justify-center sm:w-[400px] space-y-6 flex flex-col"
      >
        <Link href="/" className="w-full flex justify-left items-center">
          <Image src={SyncSpaceLogo} alt="SyncSpace Logo" width={50} height={50} />
          <span className="font-semibold dark:text-white text-4xl ml-2">
            syncspace.
          </span>
        </Link>
        <FormDescription className="text-foreground/60">
          An all-In-One Collaboration and Productivity Platform
        </FormDescription>
        {!confirmation && !codeExchangeError && (
          <>
            <FormField
              disabled={isLoading}
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="text" placeholder="Full Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={isLoading}
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="email" placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={isLoading}
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="password" placeholder="Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={isLoading}
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="w-full flex flex-col justify-center items-center h-[50px] hover:p-[2.5px] rounded-[8px] bg-gradient-to-r from-primary-blue-200 to-primary-purple-600 transition-all duration-300 ease-in-out">
              <Button
                type="submit"
                className="w-full h-full text-[15px] hover:bg-white/95 transition-all duration-300 ease-in-out"
                disabled={isLoading}
              >
                {!isLoading ? "Create Account" : <Loader />}
              </Button>
            </div>
          </>
        )}
        {submitError && (
          <FormMessage className="text-red-500">{submitError}</FormMessage>
        )}
        <span className="self-center">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-blue-300">
            Login
          </Link>
        </span>
        {(confirmation || codeExchangeError) && (
          <>
            <Alert className={confirmationAndErrorStyles}>
              {!codeExchangeError && <MailCheck className="h-4 w-4" />}
              <AlertTitle>
                {codeExchangeError ? "Invalid Link" : "Check your email"}
              </AlertTitle>
              <AlertDescription>
                {codeExchangeError ||
                  "An email confirmation link has been sent.\nPlease Verify!"}
              </AlertDescription>
            </Alert>
          </>
        )}
      </form>
    </Form>
  );
};

const Signup = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
};

export default Signup;
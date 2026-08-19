'use client';
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormSchema } from "@/lib/types";
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
import { actionLoginUser } from "@/lib/server-action/auth-actions";

const LoginPage = () => {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: "onChange",
    resolver: zodResolver(FormSchema),
    defaultValues: { email: "", password: "" },
  });

  const isLoading = form.formState.isSubmitting;

  const handleNativeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formDomData = new FormData(e.currentTarget);
    const plainPayload = {
      email: formDomData.get("email") as string,
      password: formDomData.get("password") as string
    };

    if (!plainPayload.email || !plainPayload.password) {
      setSubmitError("Please fill out all fields.");
      return;
    }

    const { error } = await actionLoginUser(plainPayload);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    router.replace("/dashboard");
  };

  // useEffect(() => {
  //   if (submitError) {
  //     setSubmiteError(""); // Reset submitError on any form change
  //   }
  // }, [submitError]);
  return (
    <Form {...form}>
      <form
        onChange={() => {
          if (submitError) setSubmitError('');
        }}
        onSubmit={handleNativeSubmit}
        className="w-full sm:justify-center sm:w-[400px] space-y-6 flex flex-col"
      >
        <Link
          href="/"
          className="w-full
        flex
        justify-left
        items-center"
        >
          <Image src={SyncSpaceLogo} alt="SyncSpace Logo" width={50} height={50} />
          <span
            className="font-semibold
          dark:text-white
          text-4xl
          ml-2
          "
          >
            syncspace.
          </span>
        </Link>
        <FormDescription className="text-foreground/60">
          An all-In-One Collaboration and Productivity Platform
        </FormDescription>
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
        {submitError && <FormMessage>{submitError}</FormMessage>}
        <div
          className="w-full flex flex-col justify-center items-center
              h-[50px]
        hover:p-[2.5px]
        rounded-[8px]
        bg-gradient-to-r
        from-primary-blue-200
        to-primary-purple-600
        transition-all duration-250 ease-in-out"
        >
          <Button
            type="submit"
            className="w-full h-full text-[15px] hover:bg-white"
            size="lg"
            disabled={isLoading}
          >
            {!isLoading ? "Login" : <Loader />}
          </Button>
        </div>
        <span className="self-center">
          Does not have an account?
          <Link href="/signup" className="text-primary-blue-300">
            Sign up
          </Link>
        </span>
      </form>
    </Form>
  );
};

export default LoginPage;

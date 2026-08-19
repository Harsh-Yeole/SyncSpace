import { z } from "zod";
import { Socket, Server as NetServer } from "net";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";

export const FormSchema = z.object({
  email: z.string().describe("Email").email({ message: "Invalid email" }),
  password: z
    .string()
    .describe("Password")
    .min(6, "Minimum 6 character password is required"),
});

export const SignupFormSchema = z
  .object({
    email: z.string().describe("Email").email({ message: "Invalid email" }),
    fullName: z
      .string()
      .describe("Full Name")
      .min(1, "Full name is required."),
    password: z
      .string()
      .describe("Password")
      .min(6, "Password must be atleast 6 characters."),
    confirmPassword: z
      .string()
      .describe("Password")
      .min(6, "Password must be atleast 6 characters."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const CreateWorkspaceFormSchema = z.object({
  workspaceName: z
    .string()
    .describe("Workspace Name")
    .min(3, "Minimum 3 character workspace name is required"),
  logo: z.any(),
});

export const UploadBannerFormSchema = z.object({
  banner: z.custom<FileList>(
    (value) => value instanceof FileList && value.length > 0,
    {
      message: "Banner Image is required",
    }
  ),
});

export type NextApiResponseServerIo = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};
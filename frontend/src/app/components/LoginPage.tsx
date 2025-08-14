"use client";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { FaRegUser } from "react-icons/fa6";
import { MdPassword } from "react-icons/md";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../../auth/login";

export const LoginSchema = z.object({
  regNo: z.string().min(1, "Registration number is required"),
  password: z.string().min(1, "Password is required"),
});
const LoginPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      regNo: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof LoginSchema>) {
    setLoading(true);
    try {
      const result = await loginUser({
        regNo: values.regNo,
        password: values.password,
      });

      if (!result.success) {
        toast.error(result.message || "Login Failed");
        return;
      }
      toast.success("Login Successful");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Login Failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex min-h-screen">
      {/* Left side - Decorative Background */}

      <div className="hidden md:flex md:w-1/2 bg-black relative overflow-hidden z-10">
        <Image
          src="https://studentspace.org.uk/assets/images/student-space_illustrations_life-as-a-black-student_1_0.png"
          alt="three students sitting on a desk"
          fill
          className="object-cover w-full h-full absolute inset-0 opacity-70"
          priority
        />
      </div>

      {/* Right side - Login Form */}
      <div className="flex flex-col items-center justify-center px-8 w-full md:w-1/2 py-10">
        <div className="max-w-md mx-auto w-full">
          <div className="flex justify-center items-center mb-8">
            <Image
              src="/school.avif"
              width={200}
              height={200}
              alt="School Logo"
              className="object-contain rounded-full"
              priority
            />
          </div>
          {/* Login Form Content */}
          <div className="text-center flex flex-col justify-between">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 mb-8">Please sign in to your account</p>
            <div className="space-y-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="regNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative flex items-center justify-center">
                            <FaRegUser
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />

                            <input
                              placeholder="Registration No."
                              {...field}
                              className="w-full pl-10 pr-4 border-2 border-gray-300 p-4 rounded-md h-[55px] focus:outline-none focus:ring-2 focus:ring-[#000]/5"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <MdPassword
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                            <input
                              type="password"
                              placeholder="Password"
                              {...field}
                              className="w-full pl-10 pr-4 border-2 border-gray-300 p-4 rounded-md h-[55px] focus:outline-none focus:ring-2 focus:ring-[#000]/5"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormDescription>
                    Remember : Passwords are CASE SENSITIVE
                  </FormDescription>
                  <Button
                    disabled={loading}
                    type="submit"
                    className="w-full h-[55px] text-white cursor-pointer bg-gray-950 hover:bg-gray-950/90"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div
                          role="status"
                          className="w-5 h-5 border-2 border-gray-300 border-t-[#000] rounded-full animate-spin"
                        >
                          <span className="sr-only">Loading...</span>
                        </div>
                      </div>
                    ) : (
                      "Log In"
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

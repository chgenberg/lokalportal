"use client";

import Image from "next/image";
import Link from "next/link";

const AUTH_IMAGE = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=960&q=80";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Image side - hidden on mobile, visible on lg+ */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-navy overflow-hidden">
        <Image
          src={AUTH_IMAGE}
          alt=""
          fill
          className="object-cover opacity-90"
          sizes="(max-width: 1024px) 0vw, 55vw"
          priority
        />
        <div className="absolute inset-0 bg-navy/50" />
        <div className="relative z-10 flex flex-col justify-end p-10 xl:p-14">
          <p className="text-white/80 text-[17px] leading-relaxed max-w-md mb-6 italic">
            &ldquo;HittaYta hjälpte oss hitta kontor på rekordtid. AI-verktyget skrev annonserna åt oss – sparade flera timmar.&rdquo;
          </p>
          <p className="text-white/60 text-[13px] font-medium">Maria K., Fastighetsförvaltare</p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 lg:py-16 bg-white">
        <div className="w-full max-w-sm animate-fade-in">
          <Link href="/" className="inline-block mb-10">
            <Image src="/HYlogo.png" alt="HittaYta" width={140} height={40} className="h-10 w-auto" priority />
          </Link>
          <h1 className="text-xl font-bold text-navy mb-1.5 tracking-tight">{title}</h1>
          {subtitle && <p className="text-[13px] text-gray-400 mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

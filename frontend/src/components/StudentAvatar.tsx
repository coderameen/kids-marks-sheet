"use client";

import Image from "next/image";
import { useState } from "react";
import { studentPhotoUrl } from "@/lib/photos";

export default function StudentAvatar({
  studentId,
  nickName,
  hasPhoto,
  size = "md",
  cacheKey,
  winner,
}: {
  studentId: number;
  nickName: string;
  hasPhoto?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  cacheKey?: string | number;
  winner?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = hasPhoto && !failed;

  const sizes = {
    sm: "h-10 w-10 text-sm ring-2",
    md: "h-12 w-12 text-lg ring-2",
    lg: "h-16 w-16 text-xl ring-[3px]",
    xl: "h-24 w-24 text-3xl ring-4",
  };

  const ring = winner
    ? "ring-amber-300 ring-offset-2"
    : "ring-white/80 ring-offset-0";

  if (showPhoto) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full bg-violet-100 ${sizes[size]} ${ring}`}
      >
        <Image
          src={studentPhotoUrl(studentId, cacheKey)}
          alt={`${nickName} profile`}
          fill
          className="object-cover"
          sizes="96px"
          onError={() => setFailed(true)}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${sizes[size]} ${ring} ${
        winner
          ? "bg-gradient-to-br from-amber-400 to-rose-500"
          : "bg-gradient-to-br from-cyan-400 to-violet-500"
      }`}
    >
      {nickName.charAt(0).toUpperCase()}
    </div>
  );
}

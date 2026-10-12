"use client";
import { useState } from "react";

export function ProfileAvatar({
  src,
  name,
  initials,
}: {
  src?: string;
  name: string;
  initials: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-100 text-xl font-black text-blue-700">
      {src && /^https?:\/\//i.test(src) && !failed ? (
        <img
          src={src}
          alt={`${name}'s profile photo`}
          width={56}
          height={56}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-label={`${name}'s initials`}>{initials}</span>
      )}
    </div>
  );
}

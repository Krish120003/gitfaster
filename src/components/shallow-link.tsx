"use client";
import { useRouter } from "next/navigation";
import React from "react";

interface ShallowLinkProps extends React.ComponentProps<"a"> {
  prefetch: boolean;
}

const ShallowLink: React.FC<ShallowLinkProps> = ({
  prefetch = false,
  ...props
}) => {
  const router = useRouter();

  const onMouseOver = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefetch) {
      router.prefetch(props.href as string);
    }
    props.onMouseOver?.(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    props.onClick?.(e);
    router.push(props.href as string);
  };

  return (
    <a {...props} onClick={handleClick} onMouseOver={onMouseOver}>
      {props.children}
    </a>
  );
};

export default ShallowLink;

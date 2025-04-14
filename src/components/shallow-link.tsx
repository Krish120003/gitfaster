"use client";

import React from "react";

interface ShallowLinkProps extends React.ComponentProps<"a"> {
  href: string;
}

const ShallowLink: React.FC<ShallowLinkProps> = ({ ...props }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.history.pushState(null, "", props.href);
  };

  return (
    <a {...props} onClick={handleClick}>
      {props.children}
    </a>
  );
};

export default ShallowLink;

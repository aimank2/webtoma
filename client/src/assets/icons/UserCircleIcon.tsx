// c:\Users\AIMANOV\Desktop\next-js\webtoma\client\src\assets\icons\UserCircleIcon.tsx
import React from "react";

const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg" // <mcreference link="http://www.w3.org/2000/svg" index="0">0</mcreference>
    width="24" // Adjusted to a more standard size, can be controlled by className
    height="24" // Adjusted to a more standard size, can be controlled by className
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props} // Spread props to allow className and other SVG attributes
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="10" r="3" />
    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
  </svg>
);

export default UserCircleIcon;

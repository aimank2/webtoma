import { ReactElement } from "react";

const Badge = ({
  text,
  rightIcon,
  className,
}: {
  text: string;
  rightIcon?: ReactElement;
  className?: string;
}) => {
  return (
    <div
      className={`max-w-full text-sm border border-input px-4 py-1 flex flex-center bg-black gap-1 w-max rounded-full capitalize ${
        className || ""
      }`}
    >
      <p className="line-clamp-1">{text}</p>
      <div>{rightIcon}</div>
    </div>
  );
};

export default Badge;

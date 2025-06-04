import { GridPattern } from "@/components/magicui/grid-pattern";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/routes/routes";
import { Link, Outlet } from "react-router-dom";

function RootLayout() {
  const generateRandomSquares = (count = 12, max = 20) =>
    Array.from({ length: count }, () => [
      Math.floor(Math.random() * max),
      Math.floor(Math.random() * max),
    ]);
  return (
    <div className="relative flex flex-col w-screen h-screen">
      {/*Logo */}
      <Link
        to={ROUTES.HOME}
        className=" font-bold no-underline absolute top-2 left-1/2 -translate-x-1/2 opacity-10 text-sm"
      >
        TETRAI
      </Link>

      {/* GridPattern as a background for all pages */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <GridPattern
          squares={generateRandomSquares().map(
            ([x, y]) => [x, y] as [number, number]
          )}
          className={cn(
            "inset-0 h-full w-full skew-x-6 opacity-45 scale-150",
            // Softer, more centralized gradient
            "[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]",
            "mask-image-[radial-gradient(300px_circle_at_center,white,transparent)]",
            "pointer-events-none select-none"
          )}
        />
      </div>

      {/* Outlet for nested routes */}
      <Outlet />
    </div>
  );
}

export default RootLayout;

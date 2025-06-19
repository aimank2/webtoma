import { Dock, DockIcon } from "@/components/magicui/dock"; // Re-import Dock and DockIcon
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/routes/routes";
import { Link, Outlet, useNavigate } from "react-router-dom";

// Import new icon components
import AccountIcon from "@/assets/icons/AccountIcon";
import ChevronLeftIcon from "@/assets/icons/ChevronLeftIcon";
import ChevronRightIcon from "@/assets/icons/ChevronRightIcon";
import HomeIcon from "@/assets/icons/HomeIcon";
import LogoutIcon from "@/assets/icons/LogoutIcon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components

function Layout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.AUTH);
  };

  return (
    <div className="flex flex-col h-screen">
      <Outlet />

      {isAuthenticated && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <Dock
            direction="middle"
            className="bg-background/80 backdrop-blur-sm"
          >
            <DockIcon className="p-[2px] scale-75" onClick={() => navigate(-1)}>
              <ChevronLeftIcon className="h-6 w-6" />
            </DockIcon>
            <Link to={ROUTES.HOME}>
              <DockIcon className="p-[2px]">
                <HomeIcon className="h-5 w-5" />
              </DockIcon>
            </Link>
            {user && (
              <Link to={ROUTES.PROFILE}>
                <DockIcon className="p-[2px]">
                  <AccountIcon className="h-5 w-5" />
                </DockIcon>
              </Link>
            )}
            <DockIcon className="p-[2px] scale-75" onClick={() => navigate(1)}>
              <ChevronRightIcon className="h-6 w-6" />
            </DockIcon>
          </Dock>
        </div>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-none flex flex-center absolute top-0 right-0 z-10 text-red-700"
          >
            <LogoutIcon className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to log out?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Layout;

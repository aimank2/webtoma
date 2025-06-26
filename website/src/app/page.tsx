import GoogleSignIn from "./components/GoogleSignIn";
import { Providers } from "./providers";

const Home = () => {
  return (
    <Providers>
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <GoogleSignIn />
      </main>
    </Providers>
  );
};

export default Home;

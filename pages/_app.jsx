import "../styles/global.css";
import "../styles/privacy.css";
import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster position="top-center" />
    </>
  );
}

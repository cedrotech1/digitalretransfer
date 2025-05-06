import { Link } from "react-router-dom";
import { Baby, Home } from "lucide-react";

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <div className="inline-flex rounded-full bg-green-100 p-4">
          <Baby className="h-16 w-16 text-green-600" />
        </div>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Page not found
        </h1>
        <p className="mt-6 text-base leading-7 text-gray-600">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            to="/"
            className="flex items-center rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            <Home className="h-4 w-4 mr-2" />
            Go back home
          </Link>
          <Link to="/login" className="text-sm font-semibold text-gray-900">
            Login <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
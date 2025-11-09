import React from 'react';

export const RouterContext = React.createContext();

export function RouterProvider({ children }) {
  const [route, setRoute] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (to) => {
    window.history.pushState({}, '', to);
    setRoute(to);
  };

  return (
    <RouterContext.Provider value={{ route, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return React.useContext(RouterContext);
}

import { LoginPage } from '../LoginPage';
import { ThemeProvider } from '../ThemeProvider';

export default function LoginPageExample() {
  return (
    <ThemeProvider>
      <LoginPage 
        onLogin={(email, password) => {
          console.log(`Login with: ${email}, password: ${password}`);
        }}
        isLoading={false}
      />
    </ThemeProvider>
  );
}
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';

const LoginPage = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const navigate = useNavigate();
	const { fetchCartItems } = useContext(CartContext);
	const { isDark } = useTheme();

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			const response = await fetch('http://localhost:5000/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (!response.ok) throw new Error(data.message || 'Failed to login');

			if (data.accessToken && data.refreshToken) {
				localStorage.setItem('accessToken', data.accessToken);
				localStorage.setItem('refreshToken', data.refreshToken);
				fetchCartItems();
				navigate('/');
			}
		} catch (error) {
			alert(error.message);
		}
	};

	return (
		<div
			className={`min-h-screen flex flex-col md:flex-row ${
				isDark ? 'bg-gray-900' : 'bg-gradient-to-r from-blue-600 to-purple-600'
			}`}
		>
			{/* Left side - Login Form */}
			<div
				className={`flex flex-col justify-center items-center md:w-1/2 px-8 py-16
        ${isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} rounded-r-3xl shadow-2xl`}
			>
				<h2 className="text-4xl font-extrabold mb-6 text-center">Sign in to your account</h2>
				<p className={`mb-12 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
					Enter your credentials to access your personalized shopping experience.
				</p>

				<form className="w-full max-w-md space-y-6" onSubmit={handleSubmit}>
					<div>
						<label htmlFor="email" className={`block mb-2 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
							Email
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							placeholder="your.email@example.com"
							className={`w-full px-5 py-3 rounded-xl border-2 focus:outline-none transition
                ${
									isDark
										? 'border-gray-600 bg-gray-900 text-gray-100 placeholder-gray-400 focus:border-blue-500'
										: 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-600'
								}`}
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className={`block mb-2 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
						>
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							placeholder="********"
							className={`w-full px-5 py-3 rounded-xl border-2 focus:outline-none transition
                ${
									isDark
										? 'border-gray-600 bg-gray-900 text-gray-100 placeholder-gray-400 focus:border-blue-500'
										: 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-600'
								}`}
						/>
					</div>

					<button
						type="submit"
						className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl shadow-lg transition"
					>
						Login
					</button>
				</form>

				<div className={`mt-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
					<span>Don't have an account? </span>
					<a href="/create-account" className="text-blue-600 hover:text-blue-800 font-semibold transition underline">
						Register
					</a>
				</div>
			</div>

			{/* Right side - Image or Graphic */}
			<div className="hidden md:flex md:w-1/2 items-center justify-center p-10">
				<img
					src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80"
					alt="Shopping illustration"
					className="rounded-3xl shadow-2xl max-w-full max-h-[600px] object-cover"
				/>
			</div>
		</div>
	);
};

export default LoginPage;

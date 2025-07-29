import { useState } from 'react';

const CreateAccountPage = () => {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const handleSubmit = (event) => {
		event.preventDefault();

		// Email validation
		if (!email.includes('@') || !email.includes('.com')) {
			alert('Please enter a valid email address.');
			return;
		}

		if (password !== confirmPassword) {
			alert('Passwords do not match');
			return;
		}

		const passwordErrors = [];
		if (password.length < 8) {
			passwordErrors.push('8 characters');
		}
		if (!/[a-z]/.test(password)) {
			passwordErrors.push('one lowercase letter');
		}
		if (!/[A-Z]/.test(password)) {
			passwordErrors.push('one uppercase letter');
		}
		if (!/[^A-Za-z0-9]/.test(password)) {
			passwordErrors.push('one special character');
		}

		if (passwordErrors.length > 0) {
			alert(`Password must contain at least ${passwordErrors.join(', ')}.`);
			return;
		}

		fetch('http://localhost:5000/register', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				username,
				email,
				password,
			}),
		})
			.then((response) => {
				if (response.ok) {
					alert('Account created successfully!');
				} else {
					return response.json().then((data) => {
						throw new Error(data.message || 'Failed to create account');
					});
				}
			})
			.catch((error) => {
				alert(`Error: ${error.message}`);
			});
	};

	return (
		<div className="min-h-screen flex">
			{/* Left side: form */}
			<div className="flex-1 flex items-center justify-center bg-white px-8 py-12 max-w-md">
				<div className="w-full">
					<h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">Create Account</h2>
					<form className="space-y-6" onSubmit={handleSubmit}>
						<div>
							<label htmlFor="username" className="block text-sm font-medium text-gray-700">
								Username
							</label>
							<input
								id="username"
								name="username"
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
                           focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring-2"
							/>
						</div>
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-gray-700">
								Email address
							</label>
							<input
								id="email"
								name="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
                           focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring-2"
							/>
						</div>
						<div>
							<label htmlFor="password" className="block text-sm font-medium text-gray-700">
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
                           focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring-2"
							/>
						</div>
						<div>
							<label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
								Confirm Password
							</label>
							<input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
                           focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring-2"
							/>
						</div>
						<button
							type="submit"
							className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition"
						>
							Create Account
						</button>
					</form>
				</div>
			</div>

			{/* Right side: image */}
			<div
				className="flex-1 hidden md:block bg-cover bg-center"
				style={{
					backgroundImage:
						"url('https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80')",
				}}
				aria-label="Create account image"
			></div>
		</div>
	);
};

export default CreateAccountPage;

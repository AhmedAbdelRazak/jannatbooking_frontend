import React from "react";
import { Link, useHistory } from "react-router-dom";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";
import { isAuthenticated, signout } from "../../auth";

const HeaderTopbar = () => {
	const { languageToggle, chosenLanguage } = useCartContext();
	const { user } = isAuthenticated();
	const history = useHistory();

	// Extract first name
	const getFirstName = (fullName) => fullName.split(" ")[0];

	// Handle signout
	const handleSignout = () => {
		signout(() => {
			window.location.href = "/";
		});
	};

	const ClickHandler = () => {
		window.scrollTo(10, 0);
		window.location.href = "/terms-conditions";
	};

	return (
		<HeaderTopbarWrapper>
			<div className='container-fluid'>
				<div className='row '>
					<div className='col col-lg-5 col-md-8 col-sm-12 col-12'>
						<div className='contact-intro'>
							<ul>
								<li>
									<i className='fa fa-envelope'></i>support@jannatbooking.com
								</li>
								<li>
									<i className='fa fa-phone'></i> +1909 (991) 4386
								</li>
								<li>
									<Link
										onClick={ClickHandler}
										to='/terms-conditions'
										style={{
											fontWeight: "bold",
											textDecoration: "underline",
											fontStyle: "italic",
											fontSize: "0.9rem",
										}}
									>
										Terms & Conditions
									</Link>
								</li>
							</ul>
						</div>
					</div>
					<div className='col col-lg-2 col-sm-12 col-12'></div>

					<div className='col col-lg-5 col-md-4 col-sm-12 col-12 '>
						<div className='contact-info float-right'>
							<ul>
								<li className='language'>
									<select
										name='language'
										id='language'
										onChange={(e) => languageToggle(e.target.value)}
									>
										{chosenLanguage === "English" ? (
											<option value='English'>English</option>
										) : (
											<option value='Arabic'>Arabic</option>
										)}
										<option value='English'>English</option>
										<option value='Arabic'>Arabic</option>
									</select>
								</li>

								{/* Social media links */}
								<li
									onClick={() =>
										window.scrollTo({ top: 8, behavior: "smooth" })
									}
								>
									<Link to='/'>
										<i className='fa-brands fa-facebook'></i>
									</Link>
								</li>
								<li
									onClick={() =>
										window.scrollTo({ top: 8, behavior: "smooth" })
									}
								>
									<Link to='/'>
										<i className='fa-brands fa-instagram'></i>
									</Link>
								</li>
								<li
									onClick={() =>
										window.scrollTo({ top: 8, behavior: "smooth" })
									}
								>
									<Link to='/'>
										<i className='fa-brands fa-youtube'></i>
									</Link>
								</li>

								{!user ? (
									<li
										onClick={() =>
											window.scrollTo({ top: 8, behavior: "smooth" })
										}
										style={{
											fontWeight: "bold",
											fontSize: "0.85rem",
											textDecoration: "underline",
											cursor: "pointer",
										}}
									>
										<Link to='/list-property'>List Your Property</Link>
									</li>
								) : null}

								{/* User greeting and Signout */}
								{user && user.name ? (
									<>
										<li
											style={{
												fontSize: "1rem",
												cursor: "pointer",
												color: "white",
												fontWeight: "bold",
											}}
											onClick={() => history.push("/dashboard")}
										>
											Hello {getFirstName(user.name)}
										</li>
										<li
											style={{
												color: "var(--orangeLight)",
												fontWeight: "bold",
												textDecoration: "underline",
											}}
											onClick={handleSignout}
										>
											Signout
										</li>
									</>
								) : (
									<>
										<li
											onClick={() =>
												window.scrollTo({ top: 8, behavior: "smooth" })
											}
											style={{
												fontSize: "0.85rem",
												cursor: "pointer",
											}}
										>
											<Link to='/signup'>Signup</Link>
										</li>
										<li
											onClick={() =>
												window.scrollTo({ top: 8, behavior: "smooth" })
											}
											style={{
												fontSize: "0.85rem",
												cursor: "pointer",
											}}
										>
											<Link to='/signin'>Signin</Link>
										</li>
									</>
								)}
							</ul>
						</div>
					</div>
				</div>
			</div>
		</HeaderTopbarWrapper>
	);
};

export default HeaderTopbar;

const HeaderTopbarWrapper = styled.div`
	background: rgba(37, 48, 65, 0.9);
	height: 50px;
	z-index: 200; /* Increased z-index */
	position: relative; /* Add position relative */

	.row {
		display: flex;
	}

	ul,
	li,
	a,
	i {
		list-style: none;
		color: white;
		margin: 0;
		padding: 0;
		line-height: 50px;
	}

	ul {
		display: flex;
		vertical-align: center;
		align-content: center;
		align-items: center;
	}

	li {
		display: inline-block;
		margin-right: 15px;
		vertical-align: center;
		align-content: center;
		align-items: center;
		border-right: 1px grey solid;
		padding-right: 20px !important;
	}

	i {
		margin-right: 3px;
	}

	.language select {
		background-color: var(--primaryBlue);
		border: none;
		color: white;
	}

	@media (max-width: 1000px) {
		display: none;
	}
`;

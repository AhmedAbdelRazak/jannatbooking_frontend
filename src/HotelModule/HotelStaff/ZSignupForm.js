import React from "react";
import styled from "styled-components";

const ZSignupForm = ({
	chosenLanguage,
	clickSubmit,
	handleChange,
	values,
	roleDescription,
	setRoleDescription,
}) => {
	return (
		<ZSignupFormWrapper isArabic={chosenLanguage === "Arabic"}>
			{chosenLanguage === "Arabic" ? (
				<form onSubmit={clickSubmit}>
					<div className='row my-5'>
						<div className='col-md-4'>
							<div className='form-group' style={{ marginTop: "10px" }}>
								<React.Fragment>
									<label htmlFor='name' style={{ fontWeight: "bold" }}>
										اسم المستخدم
									</label>
								</React.Fragment>
								<input
									type='text'
									name='name'
									value={values && values.name}
									onChange={handleChange("name")}
									required
								/>
							</div>
						</div>

						<div className='col-md-4'>
							<div className='form-group' style={{ marginTop: "10px" }}>
								<React.Fragment>
									<label htmlFor='email' style={{ fontWeight: "bold" }}>
										البريد الإلكتروني
									</label>
								</React.Fragment>
								<input
									type='text'
									name='email'
									value={values && values.email}
									onChange={handleChange("email")}
									required
								/>
							</div>
						</div>

						<div className='col-md-4'>
							<div className='form-group' style={{ marginTop: "10px" }}>
								<React.Fragment>
									<label htmlFor='phone' style={{ fontWeight: "bold" }}>
										رقم الهاتف
									</label>
								</React.Fragment>
								<input
									type='text'
									name='phone'
									value={values && values.phone}
									onChange={handleChange("phone")}
									required
								/>
							</div>
						</div>

						<div className='col-md-4'>
							<div className='form-group' style={{ marginTop: "10px" }}>
								<React.Fragment>
									<label htmlFor='role' style={{ fontWeight: "bold" }}>
										القسم
									</label>
								</React.Fragment>
								<select onChange={(e) => setRoleDescription(e.target.value)}>
									<option value=''>Please Select</option>
									<option value='reception'>Reception</option>
									<option value='housekeepingmanager'>
										House Keeping Manager
									</option>
									<option value='housekeeping'>House Keeping Staff</option>
									<option value='hotelmanager'>Hotel Manager</option>
								</select>
							</div>
						</div>

						<div className='col-md-4'>
							<div className='form-group ' style={{ marginTop: "10px" }}>
								<React.Fragment>
									<label htmlFor='password' style={{ fontWeight: "bold" }}>
										كلمة المرور
									</label>
								</React.Fragment>
								<input
									type='password'
									name='password'
									value={values && values.password}
									onChange={handleChange("password")}
									required
								/>
							</div>
						</div>

						<div className='col-md-4'>
							<div
								className='form-group'
								style={{ marginTop: "10px", marginBottom: "10px" }}
							>
								<React.Fragment>
									<label htmlFor='password2' style={{ fontWeight: "bold" }}>
										تأكيد كلمة المرور
									</label>
								</React.Fragment>
								<input
									background='red'
									type='password'
									name='password2'
									value={values && values.password2}
									onChange={handleChange("password2")}
									required
								/>
							</div>
						</div>
					</div>

					<React.Fragment>
						<input
							type='submit'
							value='تسجيل'
							className='btn btn-primary w-75 btn-block mx-auto'
							//onClick={sendEmail}
						/>
					</React.Fragment>
				</form>
			) : (
				<form onSubmit={clickSubmit}>
					<div className='row'>
						<div className='col-md-4'>
							<div className='form-group' style={{ marginTop: "10px" }}>
								<React.Fragment>
									<label htmlFor='name' style={{ fontWeight: "bold" }}>
										User Name (Hotel Manager/ Owner)
									</label>
								</React.Fragment>
								<input
									type='text'
									name='name'
									value={values && values.name}
									onChange={handleChange("name")}
									required
								/>
							</div>
						</div>

						<div className='col-md-4'>
							<div className='form-group' style={{ marginTop: "10px" }}>
								<React.Fragment>
									<label htmlFor='email' style={{ fontWeight: "bold" }}>
										Email Address
									</label>
								</React.Fragment>
								<input
									type='text'
									name='email'
									value={values && values.email}
									onChange={handleChange("email")}
									required
								/>
							</div>
						</div>

						<div className='col-md-4'>
							<div className='form-group' style={{ marginTop: "10px" }}>
								<React.Fragment>
									<label htmlFor='phone' style={{ fontWeight: "bold" }}>
										Phone Number
									</label>
								</React.Fragment>
								<input
									type='text'
									name='phone'
									value={values && values.phone}
									onChange={handleChange("phone")}
									required
								/>
							</div>
						</div>

						<div className='col-md-4'>
							<div className='form-group' style={{ marginTop: "10px" }}>
								<React.Fragment>
									<label htmlFor='role' style={{ fontWeight: "bold" }}>
										Department
									</label>
								</React.Fragment>
								<select>
									<option value=''>Please Select</option>
									<option value='reception'>Reception</option>
									<option value='housekeepingmanager'>
										House Keeping Manager
									</option>
									<option value='housekeeping'>House Keeping Staff</option>
									<option value='hotelmanager'>Hotel Manager</option>
								</select>
							</div>
						</div>

						<div className='col-md-4'>
							<div className='form-group ' style={{ marginTop: "10px" }}>
								<React.Fragment>
									<label htmlFor='password' style={{ fontWeight: "bold" }}>
										Password
									</label>
								</React.Fragment>
								<input
									type='password'
									name='password'
									value={values && values.password}
									onChange={handleChange("password")}
									required
								/>
							</div>
						</div>

						<div className='col-md-4'>
							<div
								className='form-group'
								style={{ marginTop: "10px", marginBottom: "10px" }}
							>
								<React.Fragment>
									<label htmlFor='password2' style={{ fontWeight: "bold" }}>
										{" "}
										Confirm Password
									</label>
								</React.Fragment>
								<input
									background='red'
									type='password'
									name='password2'
									value={values && values.password2}
									onChange={handleChange("password2")}
									required
								/>
							</div>
						</div>
					</div>

					<React.Fragment>
						<input
							type='submit'
							value='Register'
							className='btn btn-primary w-75 btn-block mx-auto'
							//onClick={sendEmail}
						/>
					</React.Fragment>
				</form>
			)}
		</ZSignupFormWrapper>
	);
};

export default ZSignupForm;

const ZSignupFormWrapper = styled.div`
	text-align: ${(props) => (props.isArabic ? "right" : "")};

	input[type="text"],
	input[type="email"],
	input[type="password"],
	input[type="date"],
	select,
	textarea {
		display: block;
		width: 100%;
		padding: 0.5rem;
		font-size: 1rem;
		border: 1px solid #ccc;
	}
	input[type="text"]:focus,
	input[type="email"]:focus,
	input[type="password"]:focus,
	input[type="date"]:focus,
	select:focus,
	textarea:focus,
	label:focus {
		outline: none;
		border: 1px solid var(--primaryColor);

		box-shadow: 5px 8px 3px 0px rgba(0, 0, 0, 0.3);
		transition: var(--mainTransition);
		font-weight: bold;
	}

	.form-container {
		margin-left: 20px;
		margin-right: 20px;
	}
`;

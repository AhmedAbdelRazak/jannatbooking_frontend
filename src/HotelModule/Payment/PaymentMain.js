import React, { useEffect, useState } from "react";
import AdminNavbar from "../AdminNavbar/AdminNavbar";
import AdminNavbarArabic from "../AdminNavbar/AdminNavbarArabic";
import DropIn from "braintree-web-drop-in-react";
import UpdateCardBeProComp from "./UpdateCardBeProComp";
import styled from "styled-components";
// import { Link } from "react-router-dom";
import { useCartContext } from "../../cart_context";
import {
	getBraintreeClientToken,
	processPayment_Subscription,
	updateOwnerProfile,
	updateSubscriptionCardFn,
	updateUser,
} from "../apiAdmin";
import { isAuthenticated } from "../../auth";
import { toast } from "react-toastify";
import SubscriptionDataInfo from "./SubscriptionDataInfo";

const PaymentMain = () => {
	const [AdminMenuStatus, setAdminMenuStatus] = useState(false);
	const [updateCardClicked, setUpdateCardClicked] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [data, setData] = useState({
		loading: false,
		success: false,
		clientToken: null,
		error: "",
		instance: {},
	});

	const { user, token } = isAuthenticated();
	const { languageToggle, chosenLanguage } = useCartContext();

	useEffect(() => {
		if (window.innerWidth <= 1000) {
			setCollapsed(true);
		}
		// eslint-disable-next-line
	}, []);

	const getToken = (userId, token) => {
		setData({ ...data, loading: true });
		getBraintreeClientToken(userId, token, user.storeCountry).then((data) => {
			if (data.error) {
				setData({ ...data, error: data.error });
			} else {
				setData({ ...data, clientToken: data.clientToken });
				setData({ ...data, loading: false });
			}
		});
	};

	useEffect(() => {
		getToken(user._id, token);
		// eslint-disable-next-line
	}, []);

	const updateSubscriptionCard = async () => {
		const { nonce } = await data.instance.requestPaymentMethod();
		updateSubscriptionCardFn(user._id, token, {
			paymentMethodNonce: nonce,
			paymentMethodToken: user.subscriptionToken,
			subscriptionId: user.subscriptionId,
		})
			.then((response) => {
				if (response.success) {
					toast.success("Card updated successfully for your PRO subscription");
					setTimeout(function () {
						window.location.reload(false);
					}, 4000);
				} else {
					toast.error("Failed to update card for your PRO subscription");
					setTimeout(function () {
						window.location.reload(false);
					}, 4000);
				}
			})
			.catch((error) => {
				toast.error("Error updating card for your PRO subscription");
				setTimeout(function () {
					window.location.reload(false);
				}, 4000);
			});
	};

	const buy_subscribe = () => {
		console.log("clicked");
		let nonce;

		// eslint-disable-next-line
		let getNonce = data.instance
			.requestPaymentMethod()
			.then((data) => {
				nonce = data.nonce;

				const paymentData = {
					paymentMethodNonce: nonce,
					amount: user.storeCountry === "egypt" ? 500 : 15,
					email: user.email,
					customerId: user._id,
					planId:
						user.storeCountry === "egypt" ? "monthly_plan_egy" : "monthly_plan",
				};

				processPayment_Subscription(user._id, token, paymentData)
					.then((response) => {
						if (
							response.subscription &&
							response.subscription.paymentMethodToken
						) {
							// empty cart
							// create order
							// console.log(response, "responsefromPayment");
							// eslint-disable-next-line

							toast.success(
								"CONGRATULATIONS! You now subscribed to our XLOOK PRO Plan"
							);

							console.log(response.subscription, "response.subscription");

							updateOwnerProfile(user._id, token, {
								name: user.name,
								email: user.email,
								phone: user.phone,
								platFormShare: user.platFormShare,
								platFormShareToken: user.platFormShareToken,
								subscribed: true,
								subscriptionToken: response.subscription.paymentMethodToken,
								subscriptionId: response.subscription.id,
								smsPayAsYouGo: user.smsPayAsYouGo,
								smsPayAsYouGoToken: user.smsPayAsYouGoToken,
								storeName: user.storeName,
								paymentTo: "subscribed",
							}).then((data2) => {
								if (data2.error) {
									// console.log(data.error);
									alert(data2.error);
								} else {
									console.log(data2);
									updateUser(data2, () => {
										console.log(data2, "dataUpdated");
									});
								}
							});

							setTimeout(function () {
								window.location.reload(false);
							}, 4000);
						} else {
							toast.error(
								"Not Paid, Maybe insufficient credit, Please try another card"
							);

							setTimeout(function () {
								window.location.reload(false);
							}, 2000);
						}
					})
					.catch((error) => {
						setData({ loading: false });
					});
			})
			.catch((error) => {
				// console.log("dropin error: ", error);
				setData({ ...data, error: error.message });
			});
	};

	return (
		<PaymentMainWrapper
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
			show={collapsed}
			isArabic={chosenLanguage === "Arabic"}
		>
			<div className='grid-container-main'>
				<div className='navcontent'>
					{chosenLanguage === "Arabic" ? (
						<AdminNavbarArabic
							fromPage='Payment'
							AdminMenuStatus={AdminMenuStatus}
							setAdminMenuStatus={setAdminMenuStatus}
							collapsed={collapsed}
							setCollapsed={setCollapsed}
							chosenLanguage={chosenLanguage}
						/>
					) : (
						<AdminNavbar
							fromPage='Payment'
							AdminMenuStatus={AdminMenuStatus}
							setAdminMenuStatus={setAdminMenuStatus}
							collapsed={collapsed}
							setCollapsed={setCollapsed}
							chosenLanguage={chosenLanguage}
						/>
					)}
				</div>

				<div className='otherContentWrapper'>
					<div
						className='my-3'
						style={{
							textAlign: chosenLanguage === "Arabic" ? "left" : "right",
							fontWeight: "bold",
							textDecoration: "underline",
							cursor: "pointer",
						}}
						onClick={() => {
							if (chosenLanguage === "English") {
								languageToggle("Arabic");
							} else {
								languageToggle("English");
							}
						}}
					>
						{chosenLanguage === "English" ? "ARABIC" : "English"}
					</div>

					<div className='container-wrapper'>
						{user && user.subscribed ? (
							<div className='col-md-6 platformShare mt-5'>
								<div>
									<h3>
										THANK YOU!
										<br />
										<br />
										<strong style={{ fontSize: "1.5rem", color: "darkgreen" }}>
											You have already submitted your card, our XLOOK is now
											authorized to get monthly transactions from you.
										</strong>
									</h3>
									<br />
									<br />
									<h5>
										{" "}
										<strong
											style={{
												fontSize: "1.3rem",
												textTransform: "uppercase",
												color: "black",
											}}
										>
											Thank you again for your business!
										</strong>{" "}
									</h5>
								</div>
								<div>
									<div>
										<SubscriptionDataInfo user={user} token={token} />
									</div>
								</div>
								<div
									className='mt-4'
									style={{
										fontSize: "1.2rem",
										fontWeight: "bolder",
										color: "black",
									}}
								>
									If you would like to update your card,{" "}
									<div
										onClick={() => {
											setUpdateCardClicked(!updateCardClicked);
											if (updateCardClicked === true) {
												window.scrollTo({ top: 100, behavior: "smooth" });
											} else {
												window.scrollTo({ top: 300, behavior: "smooth" });
											}
										}}
										style={{
											fontSize: "1.4rem",
											fontWeight: "bolder",
											color: "darkgoldenrod",
											cursor: "pointer",
										}}
									>
										<strong>PLEASE CLICK HERE....</strong>
									</div>
								</div>
								<div>
									{updateCardClicked ? (
										<UpdateCardBeProComp
											data={data}
											updateUserCard={updateSubscriptionCard}
										/>
									) : null}
								</div>
							</div>
						) : (
							<div className='col-md-10 mx-auto platformShare mt-5'>
								<div onBlur={() => setData({ ...data, error: "" })}>
									{data && data.clientToken ? (
										<div className=' col-md-12'>
											{chosenLanguage === "Arabic" ? (
												<>
													<h3>
														نظام إدارة الممتلكات (X-Hotel PRO PMS) الخاصة بنا
														<br />
														<strong style={{ color: "black" }}>
															{" "}
															$150/ شهرياً
														</strong>
													</h3>
													<br />
													<ul
														className='mx-auto col-md-8 ulist'
														style={{ fontWeight: "bolder" }}
													>
														<li>
															وحدة الاستقبال
															<ul className='ulist'>
																<li>الحجوزات</li>
																<li>تسجيل الوصول</li>
																<li>تسجيل المغادرة</li>
																<li>تقارير مفصلة</li>
															</ul>
														</li>
														<li>إدارة المخزون</li>
														<li>
															تجميع جميع الحجوزات من جميع القنوات في مكان واحد
														</li>
														<li>وحدة خدمة التنظيف</li>
														<li>
															لوحة تحكم المالك التي تتضمن جميع المؤشرات الرئيسية
															في مكان واحد.
														</li>
													</ul>
												</>
											) : (
												<>
													<h3>
														Our PRO PMS (Property Management System) PLAN{" "}
														<strong style={{ color: "black" }}>
															{" "}
															$150/ Month
														</strong>{" "}
													</h3>
													<ul
														className='mx-auto col-md-8 ulist'
														style={{ fontWeight: "bolder" }}
													>
														<li>
															Reception Module
															<ul className='ulist'>
																<li>Reservations</li>
																<li>Checkins</li>
																<li>Checkouts</li>

																<li>Great Reporting</li>
															</ul>
														</li>
														<li>Inventory Management</li>
														<li>
															Compiling all reservations across all channels in
															one place
														</li>
														<li>House Keeping Module</li>
														<li>
															Owner Dashboard that includes all KPI's in one
															place.
														</li>
													</ul>
												</>
											)}

											<DropIn
												options={{
													authorization: data && data.clientToken,
													// paypal: {
													// 	flow: "vault",
													// },
													// googlePay: {
													// 	flow: "vault",
													// },
													// applePay: {
													// 	flow: "vault",
													// },
												}}
												onInstance={(instance) => (data.instance = instance)}
											/>
											<button
												onClick={buy_subscribe}
												className='btn btn-success btn-block my-2 col-md-8 mx-auto'
											>
												Subscribe to our PRO plan
											</button>
										</div>
									) : null}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</PaymentMainWrapper>
	);
};

export default PaymentMain;

const PaymentMainWrapper = styled.div`
	overflow-x: hidden;
	/* background: #ededed; */
	margin-top: 20px;
	min-height: 715px;

	.grid-container-main {
		display: grid;
		grid-template-columns: ${(props) => (props.show ? "5% 75%" : "17% 75%")};
	}

	text-align: ${(props) => (props.isArabic ? "right" : "")};

	.container-wrapper {
		border: 2px solid lightgrey;
		padding: 20px;
		border-radius: 20px;
		background: white;
		margin: 0px 10px;
	}

	.ulist {
		list-style-type: none; /* Remove default bullets */
	}

	.ulist li {
		padding-left: 1.5em; /* Add some padding to the left of list items */
	}

	.ulist li::before {
		content: "✔︎"; /* Insert content before each li element */
		padding-right: 0.5em; /* Add some padding to the right of the check mark */
		color: green; /* Make the check mark green */
	}

	@media (max-width: 1400px) {
		background: white;
	}
`;

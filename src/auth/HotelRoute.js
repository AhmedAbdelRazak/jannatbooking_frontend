/** @format */

import React from "react";
import { Route, Redirect } from "react-router-dom";
import { isAuthenticated } from "./index";

const HotelRoute = ({ component: Component, ...rest }) => (
	<Route
		{...rest}
		render={(props) =>
			isAuthenticated() && isAuthenticated().user.role === 2000 ? (
				<Component {...props} />
			) : (
				<Redirect
					to={{
						pathname: "/",
						state: { from: props.location },
					}}
				/>
			)
		}
	/>
);

export default HotelRoute;

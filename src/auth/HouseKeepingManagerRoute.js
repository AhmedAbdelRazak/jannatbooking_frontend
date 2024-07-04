/** @format */

import React from "react";
import { Route, Redirect } from "react-router-dom";
import { isAuthenticated } from "./index";

const HouseKeepingManagerRoute = ({ component: Component, ...rest }) => (
	<Route
		{...rest}
		render={(props) =>
			isAuthenticated() && isAuthenticated().user.role === 4000 ? (
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

export default HouseKeepingManagerRoute;

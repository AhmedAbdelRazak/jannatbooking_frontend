/** @format */

import React from "react";
import { Route, Redirect } from "react-router-dom";
import { isAuthenticated } from "./index";

const HouseKeepingEmployeeRoute = ({ component: Component, ...rest }) => (
	<Route
		{...rest}
		render={(props) =>
			isAuthenticated() && isAuthenticated().user.role === 5000 ? (
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

export default HouseKeepingEmployeeRoute;

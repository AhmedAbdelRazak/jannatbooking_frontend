import React from "react";
import styled from "styled-components";
import Hero from "../components/Home/Hero";
import Search from "../components/Home/Search";
import PopularHotels from "../components/Home/PopularHotels";

const Home = () => {
	return (
		<HomeWrapper>
			<Hero />
			<Search />
			<PopularHotels />
		</HomeWrapper>
	);
};

export default Home;

const HomeWrapper = styled.div`
	min-height: 2000px;
`;

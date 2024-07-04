import styled from "styled-components";
import { Link } from "react-router-dom";

const LastAddedLogoImage = () => {
	var logoUrl =
		"https://res.cloudinary.com/infiniteapps/image/upload/v1640547562/Infinite-Apps/MyLogo_p0bqjs.jpg";

	return (
		<>
			<LastAddedLogoImageWrapper>
				<div
					className='logoClass no-background'
					style={{
						textAlign: "center",
						padding: "5px",
						marginLeft: "50%",
						marginTop: "5px",
						objectFit: "cover",
					}}
				>
					<Link to='/hotel-management/dashboard'>
						<img
							id='logoImage'
							src={logoUrl}
							alt='infinite-apps.com'
							style={{
								width: "100px",
								objectFit: "cover",
							}}
						/>
					</Link>
				</div>
			</LastAddedLogoImageWrapper>
		</>
	);
};

export default LastAddedLogoImage;

const LastAddedLogoImageWrapper = styled.div`
	h3 {
		color: white !important;
	}
`;

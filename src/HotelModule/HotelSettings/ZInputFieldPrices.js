import React from "react";

const ZInputFieldPrices = ({
	targetedPricingTitle,
	targetedPricing,
	targetedPricingProperty,
	handlePriceChange,
	value,
}) => {
	return (
		<div className='col-md-2'>
			<label
				htmlFor='name'
				style={{
					fontWeight: "bold",
					fontSize: "12px",
					textAlign: "center",
				}}
			>
				{targetedPricingTitle}
			</label>
			<input
				type='number'
				value={value}
				onChange={(e) =>
					handlePriceChange(
						targetedPricing,
						targetedPricingProperty,
						e.target.value
					)
				}
				required
			/>
		</div>
	);
};

export default ZInputFieldPrices;

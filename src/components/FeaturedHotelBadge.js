import React from "react";
import styled from "styled-components";

const labels = {
  English: "Jannat Booking Choice",
  Arabic:
    "\u0627\u062e\u062a\u064a\u0627\u0631 \u062c\u0646\u0627\u062a \u0628\u0648\u0643\u064a\u0646\u062c",
};

const FeaturedHotelBadge = ({
  chosenLanguage = "English",
  compact = false,
}) => {
  const label = labels[chosenLanguage] || labels.English;

  return (
    <Badge
      $compact={compact}
      dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
      aria-label={label}
    >
      <span aria-hidden="true">\u2726</span>
      {label}
    </Badge>
  );
};

export default FeaturedHotelBadge;

const Badge = styled.span`
  align-items: center;
  align-self: flex-start;
  background: linear-gradient(135deg, #fff9ea 0%, #f7edcf 100%);
  border: 1px solid rgba(167, 126, 42, 0.42);
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(112, 82, 23, 0.1);
  color: #765415;
  display: inline-flex;
  font-size: ${({ $compact }) => ($compact ? "0.68rem" : "0.76rem")};
  font-weight: 750;
  gap: 5px;
  letter-spacing: 0.01em;
  line-height: 1;
  margin-bottom: ${({ $compact }) => ($compact ? "5px" : "8px")};
  padding: ${({ $compact }) => ($compact ? "5px 8px" : "6px 10px")};
  text-transform: none;
  width: fit-content;

  span {
    color: #b48a35;
    font-size: 0.9em;
  }
`;

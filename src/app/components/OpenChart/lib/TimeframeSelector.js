import React from "react";

const timeframes = ["1H", "1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "ALL"];

const TimeframeSelector = ({ selectedTimeframe, onChange }) => {
  return (
    <>
      <ul className="chartButtons">
        {timeframes.map((timeframe) => (
          <li
            key={timeframe}
            className={selectedTimeframe === timeframe ? "active" : ""}
            onClick={() => onChange(timeframe)}
          >
            {timeframe}
          </li>
        ))}
      </ul>

      {/* Styled JSX for component-scoped CSS */}
      <style jsx>{`
        /* Wrapper styling */
        .chartWrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        /* Buttons (ul and li styling) */
        .chartButtons {
          list-style: none;
          display: flex;
          justify-content: flex-start;
          gap: 1px;
          padding: 0;
          margin: 10px 0 0 0;
          box-sizing: border-box;
        }

        .chartButtons li {
          background-color: #3da5ed;
          color: #fff;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
          text-align: center;
          flex: 1;
          min-width: 20px;
        }

        .chartButtons li:hover {
          background-color: #037ffc;
        }

        /* Chart container */
        .chartContainer {
          position: relative;
          height: 300px;
          margin-top: 10px;
        }

        .chartButtons li.active {
          background-color: #ffd700; /* Highlighted color (gold) */
          color: #000;
          font-weight: bold;
        }
      `}</style>
    </>
  );
};

export default TimeframeSelector;

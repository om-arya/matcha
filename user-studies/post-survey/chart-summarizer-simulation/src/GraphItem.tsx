interface GraphItemProps {
    imagePath: string;
    altText: string;
}

const GraphItem = ({ imagePath, altText }: GraphItemProps) => {
  return (
    <div className="graph-item">
      <img src={imagePath} alt={altText} className="graph" />
      <p>
        ID?
      </p>
      <p>
        Question1
      </p>
    </div>
  );
};

export default GraphItem;
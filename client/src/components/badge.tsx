const Badge = ({ text }: { text: string }) => {
  return (
    <div className="text-sm border border-input px-4 py-1 flex flex-center w-max rounded-full capitalize">
      {text}
    </div>
  );
};

export default Badge;

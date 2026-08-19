import React from "react";
import CustomDialogTrigger from "../global/custom-dialog";
import TrashRestore from "./trash-restrore";
interface TrashProps {
  children: React.ReactNode;
}

const Trash: React.FC<TrashProps> = ({ children }) => {
  return (
    <CustomDialogTrigger header="Trash" content={<TrashRestore />}>
      {children}
    </CustomDialogTrigger>
  );
};

export default Trash;

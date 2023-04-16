import React, { Component } from "react";

export default function Board() {
    const categories = [
      'To Buy',
      'Out of Stock'
    ];


    return (
      <div className="dashboard flex-row">
        {categories.map((title) => (
            <p>{title}</p>
          )
        )}
      </div>
    );
}
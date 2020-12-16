import { Box, Flex, Link } from "@chakra-ui/react";
import React from "react";

interface NavBarProps {}

const NavBar: React.FC<NavBarProps> = ({}) => {
  return (
    <Flex backgroundColor="tomato" p={4}>
      <Box ml={"auto"}>
        <Link mr={2} href="/login">
          Login
        </Link>
        <Link href="/register">Register</Link>
      </Box>
    </Flex>
  );
};

export default NavBar;
